<?php
$response = array();
include("../../connect.php");
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (strpos($contentType, 'application/json') !== false) {
	$rawData = file_get_contents("php://input");

	$post = json_decode($rawData, true);

	if ($post === null) {
		echo json_encode(["error" => "Invalid JSON received"]);
		exit;
	}
} elseif (strpos($contentType, 'application/x-www-form-urlencoded') !== false) {
	$post = $_POST;
} else {
	$post = $_POST;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($post['key_uid']) && isset($post['amount']) && isset($post['key_pid']) && isset($post['payment_mode']) && isset($post['payment_status']) && isset($post['distributor_id']) && isset($post['disc_amt']) && isset($post['final_amt']) && isset($post['invoice_type']) && isset($post['cess_amount'])) {
	$bodydata = print_r($post, true);
	$dis_id = $post['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con, "SELECT country,place_of_supply,state_code FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if (mysqli_num_rows($disSql) > 0) {
		$disRow = mysqli_fetch_array($disSql);
		$dist_supply = $disRow['place_of_supply'];
		$dist_state_code = $disRow['state_code'];
		if ($disRow['country'] == 'United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$query_log = mysqli_query($con, "insert into tbl_sale_log_data(`distributor_id`,`transaction_date`,`log_data`,`source`)values('$dis_id','$da','$bodydata','Admin')");
	$bank_name = "";
	$cheque_no = "";
	$cheque_date = "";
	$invoice_date = isset($_POST['invoice_date']) ? $_POST['invoice_date'] : $da;
	$client1 = $post['key_uid'];
	$amount = $post['amount'];
	$disc_amt = $post['disc_amt'];
	$final_amt = $post['final_amt'];
	$cess_amt = $post['cess_amount'];
	$round_off_amt = $post['round_off_amt'];
	$toder = $post['total_order'];

	if (strpos($toder, 'pid') !== false) {
		$productdetailexists = "Yes";
	} else {
		$productdetailexists = "No";
	}

	if ($toder == '[]' || $productdetailexists == 'No') {
		$response['success'] = 0;
		$response['details'] = "Item Detail Missing. Please try again later!!";
	} else {
		$p_client = $post['key_pid'];
		$disc_bill_amt = isset($post['bill_discount_amt']) ? $post['bill_discount_amt'] : '0';
		$dist_operator = isset($post['operator']) ? $post['operator'] : '';
		$gstconfig = isset($post['gstconfig']) ? $post['gstconfig'] : '';
		$photoname = '';
		$sign_image = isset($_FILES['sign_image']['name']) ? $_FILES['sign_image']['name'] : '';
		if ($sign_image != "") {
			$destination = "../../../bthawk/retailer_bill_signature/";
			$photoname = basename($_FILES['sign_image']['tmp_name']) . '.png';
			move_uploaded_file($_FILES['sign_image']['tmp_name'], $destination . '' . $photoname);
		}
		$credit_days = isset($_POST['credit_days']) ? $_POST['credit_days'] : '0';
		$labouramt = isset($post['labouramt']) ? $post['labouramt'] : '0';
		$freightamt = isset($post['freightamt']) ? $post['freightamt'] : '0';
		$otherexpamt = isset($post['otherexpamt']) ? $post['otherexpamt'] : '0';
		$party_gstin = isset($post['party_gstin']) ? $post['party_gstin'] : '';
		if ($party_gstin == '') {
			$check_party_gst = mysqli_query($con, "select gstin_no from tbl_party where distributor_id ='$dis_id' and party_id='$p_client'");
			while ($row_party_gst = mysqli_fetch_array($check_party_gst)) {
				$party_gstin = $row_party_gst['gstin_no'];
			}
		}
		$shipping_address_value = isset($post['shipping_address_value']) ? $post['shipping_address_value'] : '';
		$check_product_type = isset($post['invoice_product_type']) ? $post['invoice_product_type'] : '';
		$pmode = $post['payment_mode'];
		$serial_bill = isset($post['serial_bill']) ? $post['serial_bill'] : '';
		$latitude = isset($post['latitude']) ? $post['latitude'] : '';
		$longitude = isset($post['longitude']) ? $post['longitude'] : '';
		$pstatus = $post['payment_status'];
		$tds_amt = isset($post['tds_amt']) ? $post['tds_amt'] : '';
		$bank_name = isset($post['bank_name']) ? $post['bank_name'] : '';
		$cheque_no = isset($post['cheque_no']) ? $post['cheque_no'] : '';
		$cheque_date = isset($post['cheque_date']) ? $post['cheque_date'] : '';
		$remark = $post['remark'];
		$invoice_type1 = $post['invoice_type'];

		$courier_facility = isset($post['courier_facility']) ? $post['courier_facility'] : 'No';
		$courier_no = isset($post['courier_no']) ? $post['courier_no'] : '';
		$reference_no = isset($post['reference_no']) ? $post['reference_no'] : '';
		$courier_date = isset($post['courier_date']) ? $post['courier_date'] : '';
		$courier_company = isset($post['courier_company']) ? $post['courier_company'] : '';
		$brokerno = isset($post['broker_number']) ? $post['broker_number'] : '';

		$tcs_perc = isset($post['tcs_perc']) ? $post['tcs_perc'] : '0';
		$tcs_applicable = isset($post['tcs_applicable']) ? $post['tcs_applicable'] : 'No';
		$tcs_Amt = isset($post['tcs_Amt']) ? $post['tcs_Amt'] : '0';
		if ($tcs_applicable == 'No')
			$tcs_Amt = 0;
		
		$json_a = json_decode($toder, true);
		foreach ($json_a as $person_a) 
		{
			$prodid = $person_a['pid'];
			$ordquantiy = $person_a['quantity'];
			$pur_maintain_inventory = 'No';
						
			$res_check_product = mysqli_query($con, "SELECT maintain_inventory FROM  tbl_product where distributor_id='$dis_id' and product_id='$prodid'");
			while ($row_stock1 =  mysqli_fetch_assoc($res_check_product)) {
				$pur_maintain_inventory = $row_stock1['maintain_inventory'];
			}
			if ($pur_maintain_inventory == 'Yes') 
			{					
				$res_stock=mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date <='$da' and distributor_id='$dis_id' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
				if(mysqli_num_rows($res_stock) > 0)
				{
					$row_stock = mysqli_fetch_assoc($res_stock);
					if($row_stock['closing_stock'] < $ordquantiy)
					{					
						$response['success'] = 0;
						$response['details'] = "Item Stock Missing. Please check your stock and try again later!!";
						echo json_encode($response);
						die();
					}
				}
			}
		}

		if ($dist_operator == '') {
			$check_author = mysqli_query($con, "select sender_id from tbl_distributor_operator_master where distributor_id ='$dis_id' and operator_id in (select operator_id from tbl_operator_master where operator_name='Auto Fill Transfer')");
			while ($row_data = mysqli_fetch_array($check_author)) {
				$dist_sender_id = $row_data['sender_id'];
				if ($dist_sender_id == "JIONET")
					$dist_operator = 'JIO';
				else if ($dist_sender_id == "Airtel")
					$dist_operator = 'Airtel';
			}
		}
		if ($courier_date != '') {
			$temp_string = explode("/", $courier_date);
			$temp_string2 = $temp_string[1];
			$temp_string3 = $temp_string[2];
			$temp_data_date = $temp_string[0] . "-" . $temp_string2 . "-" . $temp_string3;
			$temp_date2 = strtotime($temp_data_date);
			$courier_date = date("Y-m-d", $temp_date2);
		}

		$message_txn_id = isset($post['message_txn_id']) ? $post['message_txn_id'] : '';
		$party_phone = isset($post['party_number']) ? $post['party_number'] : '';
		$message_date = isset($post['message_date']) ? $post['message_date'] : '';
		$message_time = isset($post['message_time']) ? $post['message_time'] : '';
		$message_amount = isset($post['message_amount']) ? $post['message_amount'] : '';
		$payment_type = isset($post['payment_type']) ? $post['payment_type'] : '';
		$reverse_charge_val = isset($post['reverse_charge_val']) ? $post['reverse_charge_val'] : 'N';

		$deposit_bank_id = isset($post['bnk_id']) ? $post['bnk_id'] : '0';
		$consignee_name = isset($post['consignee_name']) ? $post['consignee_name'] : '';
		$g_r_no = isset($post['g_r_no']) ? $post['g_r_no'] : '';
		$transport_date = isset($post['transport_date']) ? $post['transport_date'] : '';
		$transport_address = isset($post['transport_address']) ? $post['transport_address'] : '';
		$transport_company = isset($post['transport_company']) ? $post['transport_company'] : '';
		$check_author = mysqli_query($con, "select dsr_requirement,serialno_configuration from tbl_distributor where distributor_id='$dis_id'");
		while ($row_data = mysqli_fetch_array($check_author)) {
			$dist_dsr_require = $row_data['dsr_requirement'];
			$dist_serialno_config = $row_data['serialno_configuration'];
		}
		if ($pmode == "Both") {
			$cash_amt = $post['cash_amount'];
			$cheque_amt = $post['cheque_amount'];
		} else if ($pmode == "Cash") {
			$cash_amt = $final_amt;
			$cheque_amt = 0;
		} else if ($pmode == "Credit") {
			$cash_amt = $cheque_amt = 0;
		} 
		else {
			$cash_amt = 0;
			$cheque_amt = $final_amt;
		}

		$scri = $da . " " . $scro;
		$temp_date2 = strtotime($da);
		$msg_insert_check = 0;

		if ($party_phone != '' && $dist_operator == 'BSNL' && $p_client == 0) {
			$insert_party = mysqli_query($con, "INSERT INTO tbl_party(party_name,party_phone,distributor_id,group_name,place_of_supply, state_name,tb_insertdatetime, status,party_code) VALUES ('$party_phone','$party_phone','$dis_id','Sundry Debtors','$dist_supply','$dist_supply','$da','Active','$dist_state_code');");
			$p_client = mysqli_insert_id($con);
			$query11 = mysqli_query($con, "insert into tbl_party_user(party_id,user_id,insert_date)values('$p_client','$client1','$da')");
		}


		if ($message_txn_id != '') {
			$first_day_msg = date('Y-m-01', strtotime($message_date));
			$last_day_msg = date('Y-m-t', strtotime($message_date));
			$select_message11 = mysqli_query($con, "select message_id from `tbl_retailer_message_detail` where user_id='$client1' and transaction_id='$message_txn_id'");
			$select_message = mysqli_query($con, "SELECT message_id from `tbl_autofill_retailer_message_detail` where transaction_id='$message_txn_id' and distributor_id='$dis_id' and message_date>='$first_day_msg' and message_date<='$last_day_msg'");
			if (mysqli_num_rows($select_message) <= 0 && mysqli_num_rows($select_message11) <= 0) {
				$select_message_1 = mysqli_query($con, "select * from `tbl_party_transaction` where transaction_from='$client1' and message_txn_id='$message_txn_id' and transaction_date>='$first_day_msg' and transaction_date<='$last_day_msg'");
				if (mysqli_num_rows($select_message_1) <= 0) {
					$query_message = mysqli_query($con, "INSERT INTO `tbl_autofill_retailer_message_detail`(`distributor_id`, `user_id`, `transaction_id`, `amount`, `party_phone`, `message_date`, `message_time`, `insert_date`, `insert_time`, `status`, `complete_date`, `complete_time`,`operator_detail`,`actual_bill_type`) VALUES ('$dis_id','$client1','$message_txn_id','$message_amount','$party_phone','$message_date','$message_time','$da','$scro','Bill','$da','$scro','$dist_operator','Yes')");
					$query_message11 = mysqli_query($con, "insert into tbl_retailer_message_detail(`user_id`,`transaction_id`,`amount`,`message_date`, `message_time`,`party_phone`,`insert_date`,`insert_time`,`status`,`complete_date`,`complete_time`)values('$client1','$message_txn_id','$message_amount','$message_date','$message_time','$party_phone','$da','$scro','Complete','$da','$scro')");
					$msg_insert_check = 0;
				} else {
					$msg_insert_check = 1;
				}
			} else {
				$msg_insert_check = 1;
			}
		}
		if ($msg_insert_check == 0) {
			$check_flag = "false";
			if ($message_txn_id > 0) {
				$check_flag = "true";
				$check_author = mysqli_query($con, "select place_of_supply from tbl_distributor where distributor_id='$dis_id'");
				$fetch_client_place = mysqli_fetch_array($check_author);
				$dist_place_id = $fetch_client_place['place_of_supply'];

				$check_party_result = mysqli_query($con, "SELECT place_of_supply from tbl_party where distributor_id='$dis_id' and party_id='$p_client'");
				if (mysqli_num_rows($check_party_result) > 0) {
					$fetch_party_place = mysqli_fetch_array($check_party_result);
					$party_place_id = $fetch_party_place['place_of_supply'];
				}
				$show_flag = 0;
				if ($dist_place_id == '' || $party_place_id == '') {
					$show_flag = 0;
				} else {
					if ($party_place_id == $dist_place_id)
						$show_flag = 0;
					else
						$show_flag = 1;
				}
			}
			include("../client_bill_sequence.php");
			$SendSequence = new SendSequence();
			$sd = $SendSequence->fetch_sequence($dis_id, $invoice_type1, $con);
			if ($sd != '') {
				$transaction_id = substr(uniqid(rand(), 1), 0, 7) . '_' . uniqid() . '_' . substr(rand(), 1, 3);
				
				if($da!=$invoice_date)
				{
					$bill_history_insert=mysqli_query($con,"INSERT INTO `tbl_bill_move_history`(`distributor_id`,`transaction_id`,`insert_date`,`insert_time`) VALUES ('$dis_id','$transaction_id','$da','$scro')");
				}
				
				$query = "insert into tbl_party_transaction(transaction_id,transaction_date,transaction_time,transaction_bill_number,transaction_from,transaction_to,total_amount,payment_mode,payment_status,bank_name,cheque_no,cash_amount,cheque_amount,remark,cheque_date,disc_amt,final_amt,bill_type,cess_amount,round_off_amt,serial_no_bill,bill_date,latitude,longitude,courier_facility,courier_no,reference_no,courier_date,courier_company,message_txn_id,consignee_name,transport_company,g_r_no,transport_date,transport_address,tds_amt,party_gstin,labour_charges,freight_charges,other_expenses,generated_by,sign_image,gst_configure,source,discount_on_total,broker_no,is_tcs,tcs_amount,final_amt_w_tcs,tcs_percentage,dsr_requirement_val,bank_id,payment_type,reverse_charge,shipping_address,invoice_add_date,credit_days)values('$transaction_id','$invoice_date','$scro','$sd','$client1','$p_client','$amount','$pmode','$pstatus','$bank_name','$cheque_no','$cash_amt','$cheque_amt','$remark','$cheque_date','$disc_amt','$final_amt','$invoice_type1','$cess_amt','$round_off_amt','$serial_bill','$invoice_date','$latitude','$longitude','$courier_facility','$courier_no','$reference_no','$courier_date','$courier_company','$message_txn_id','$consignee_name','$transport_company','$g_r_no','$transport_date','$transport_address','$tds_amt','$party_gstin','$labouramt','$freightamt','$otherexpamt','','$photoname','$gstconfig','Admin','$disc_bill_amt','$brokerno','$tcs_applicable','$tcs_Amt','$final_amt','$tcs_perc','$dist_dsr_require','$deposit_bank_id','$payment_type','$reverse_charge_val','$shipping_address_value','$da','$credit_days')";
				$res = mysqli_query($con, $query);
				if ($res) {
					$bill_invoice_id = $transaction_id;
					$json_a = json_decode($toder, true);
					foreach ($json_a as $person_a) {
						$prodid = $person_a['pid'];
						$prodname = $person_a['pname'];
						$ordquantiy = $person_a['quantity'];
						$proprice = $person_a['pro_price'];
						$cgstamt = isset($person_a['cgst_amt']) ? $person_a['cgst_amt'] : '';
						$sgstamt = isset($person_a['sgst_amt']) ? $person_a['sgst_amt'] : '';
						$igstamt = isset($person_a['igstamt']) ? $person_a['igstamt'] : '';
						$dis_type = isset($person_a['discount_type']) ? $person_a['discount_type'] : '';
						$dis_per = isset($person_a['discount_percen']) ? $person_a['discount_percen'] : '';
						$cess_per_amt = isset($person_a['cess_per_amt']) ? $person_a['cess_per_amt'] : '';
						$cess_percentage = isset($person_a['cess_percentage']) ? $person_a['cess_percentage'] : '';
						$cess_final_amt = isset($person_a['cess_final_amt']) ? $person_a['cess_final_amt'] : '';
						$pro_discount = isset($person_a['pro_discount']) ? $person_a['pro_discount'] : '';
						$pro_imei_no = isset($person_a['serial']) ? $person_a['serial'] : '';
						$pro_actual_qty = isset($person_a['actual_qty']) ? $person_a['actual_qty'] : '0';
						$pro_gst_perc = isset($person_a['gst_perc']) ? $person_a['gst_perc'] : '0';
						$pur_total_amt = isset($person_a['pur_total_amt']) ? $person_a['pur_total_amt'] : '0';
						$pur_taxable_amt = isset($person_a['pur_taxable_amt']) ? $person_a['pur_taxable_amt'] : '0';
						$probagtype = isset($person_a['pro_bagtype']) ? $person_a['pro_bagtype'] : '0';
						$probagqty = isset($person_a['pro_bagqty']) ? $person_a['pro_bagqty'] : '0';
						$consume_flag = isset($person_a['consume_flag']) ? $person_a['consume_flag'] : 'No';
						$consume_totalorder = isset($person_a['consume_totalorder']) ? $person_a['consume_totalorder'] : '';
						$d_type = isset($person_a['disc_type']) ? $person_a['disc_type'] : '';
						$sale_unit = isset($person_a['sale_unit']) ? $person_a['sale_unit'] : '';
						$profree_flag = isset($fetch_product11['profree_flag']) ? $fetch_product11['profree_flag'] : '';
						$profree_product_id = isset($fetch_product11['profree_product_id']) ? $fetch_product11['profree_product_id'] : '';
						$cartmrp = isset($fetch_product11['cartmrp']) ? $fetch_product11['cartmrp'] : '0';

						$pur_maintain_inventory = $person_a['maintain_inventory'];
						if ($pur_maintain_inventory == '') {
							$res_check_product = mysqli_query($con, "SELECT maintain_inventory FROM  tbl_product where distributor_id='$dis_id' and product_id='$prodid'");
							while ($row_stock1 =  mysqli_fetch_assoc($res_check_product)) {
								$pur_maintain_inventory = $row_stock1['maintain_inventory'];
							}
						}
						if ($show_flag == 0 && $igstamt > 0 && $check_flag == "true") {
							$cgstamt = $sgstamt = round($igstamt / 2, 2);
							$igstamt = 0;
						} else if ($show_flag == 1 && $cgstamt > 0 && $check_flag == "true") {
							$igstamt = round($cgstamt + $sgstamt, 2);
							$cgstamt = $sgstamt = 0;
						}

						$query2 = mysqli_query($con, "insert into tbl_party_transaction_detail(transaction_id,product_id,product_name,quantity, CGST_amount,SGST_amount, product_price, discount_type,discount_percentage,cess_pc_amt,cess_percentage,cess_final_amt,product_disc,IMEI_NO, IGST_amount,actual_quantity, gst_perc,product_total_amt,taxable_amount,bag_type,bag_qty,consume_detail,dis_type,sale_unit,free_flag, free_product_id,MRP)values('$bill_invoice_id','$prodid','$prodname','$ordquantiy','$cgstamt','$sgstamt','$proprice','$dis_type','$dis_per','$cess_per_amt','$cess_percentage','$cess_final_amt','$pro_discount','$pro_imei_no','$igstamt','$pro_actual_qty','$pro_gst_perc','$pur_total_amt','$pur_taxable_amt','$probagtype','$probagqty','$consume_flag','$d_type','$sale_unit','$profree_flag','$profree_product_id','$cartmrp')");
						if ($query2) {
							$re_txn_detail = mysqli_insert_id($con);
							if ($serial_bill == "Yes" && $pro_imei_no != '' && $dist_serialno_config == 'Standard') {
								$uq = mysqli_query($con, "UPDATE tbl_product_serialno SET status='Sold',saleout_date='$da',saleout_time='$scro' where IMEI ='$pro_imei_no' and product_id='$prodid'");
							}
							if ($consume_flag == 'Yes') {
								$json_a_order = json_decode($consume_totalorder, true);
								foreach ($json_a_order as $person_consume) {
									$con_pro_id_val = $person_consume['consume_product_id'];
									$consume_qty = $person_consume['consume_qty'];
									$new_quantity = $person_consume['consume_total_qty'];
									$res_stock = mysqli_query($con, "SELECT * FROM  tbl_distributor_stock where date ='$da' and distributor_id='$dis_id' and product_id='$con_pro_id_val' ORDER BY `date` DESC LIMIT 1");
									if (mysqli_num_rows($res_stock) > 0) {
										$row_stock =  mysqli_fetch_assoc($res_stock);
										$stock_quantity = $row_stock['closing_stock'];
										$temp_quantity = round($stock_quantity - $new_quantity, 2);
										$uq = mysqli_query($con, "UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scro' where date ='$da' and distributor_id='$dis_id' and product_id='$con_pro_id_val'");
										$uq1 = mysqli_query($con, "UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$scri' where product_id='$con_pro_id_val' and distributor_id='$dis_id'");
										$query_consume = mysqli_query($con, "INSERT INTO `tbl_party_transaction_consumable_detail`( `transaction_detail_id`, `product_id`, `consume_product_id`, `consume_quantity`,`total_qty_consume`,`txn_date`) VALUES ('$re_txn_detail','$prodid','$con_pro_id_val','$consume_qty','$new_quantity','$da')");
									} else {
										$res_stock1 = mysqli_query($con, "SELECT * FROM  tbl_distributor_stock where date <='$da' and distributor_id='$dis_id' and product_id='$con_pro_id_val' ORDER BY `date` DESC LIMIT 1");
										if (mysqli_num_rows($res_stock1) > 0) {
											$row_stock1 =  mysqli_fetch_assoc($res_stock1);
											$stock_quantity = $row_stock1['closing_stock'];
											$temp_quantity = round($stock_quantity - $new_quantity, 2);
											$stock_insert = mysqli_query($con, "insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$dis_id','$con_pro_id_val','$stock_quantity','$temp_quantity','$da','$scro')");
											$uq1 = mysqli_query($con, "UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$scri' where product_id='$con_pro_id_val' and distributor_id='$dis_id'");
											$query_consume = mysqli_query($con, "INSERT INTO `tbl_party_transaction_consumable_detail`( `transaction_detail_id`, `product_id`, `consume_product_id`, `consume_quantity`,`total_qty_consume`,`txn_date`) VALUES ('$re_txn_detail','$prodid','$con_pro_id_val','$consume_qty','$new_quantity','$da')");
										}
									}
								}
							} else if ($pur_maintain_inventory == "Yes") {
								$query_stock = "SELECT closing_stock FROM  tbl_distributor_stock where date ='$da' and distributor_id='$dis_id' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1";
								$res_stock = mysqli_query($con, $query_stock);
								$row_stock =  mysqli_fetch_assoc($res_stock);
								if (mysqli_num_rows($res_stock) > 0) {
									$stock_quantity = $row_stock['closing_stock'];
									$temp_quantity = round($stock_quantity - $ordquantiy, 2);
									$uq = mysqli_query($con, "UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity' where date ='$da' and distributor_id='$dis_id' and product_id='$prodid'");
									$uq_product = mysqli_query($con, "UPDATE tbl_product SET stock_quantity='$temp_quantity' where distributor_id='$dis_id' and product_id='$prodid'");
								} else {
									$query_stock1 = "SELECT closing_stock FROM  tbl_distributor_stock where date <='$da' and distributor_id='$dis_id' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1";
									$res_stock1 = mysqli_query($con, $query_stock1);
									$row_stock1 =  mysqli_fetch_assoc($res_stock1);
									if (mysqli_num_rows($res_stock1) > 0) {
										$stock_quantity = $row_stock1['closing_stock'];
										$temp_quantity = round($stock_quantity - $ordquantiy, 2);
										$stock_insert = mysqli_query($con, "insert into tbl_distributor_stock(distributor_id,product_id, closing_stock,opening_stock,date)values('$dis_id','$prodid','$temp_quantity','$stock_quantity','$da')");
										$uq_product = mysqli_query($con, "UPDATE tbl_product SET stock_quantity='$temp_quantity' where distributor_id='$dis_id' and product_id='$prodid'");
									} else {
										$stock_insert = mysqli_query($con, "insert into tbl_distributor_stock(distributor_id,product_id, closing_stock,opening_stock,date)values('$dis_id','$prodid','-$ordquantiy','0','$da')");
										$uq_product = mysqli_query($con, "UPDATE tbl_product SET stock_quantity='-$ordquantiy' where distributor_id='$dis_id' and product_id='$prodid'");
									}
								}
							}
						}
					}


					if ($invoice_type1 == "Receipt") {
						$response['url'] = "download_receipt_invoice.php?id=" . $bill_invoice_id . "&user_id=" . $dis_id;
						$response['url_hindi'] = "download_receipt_invoice.php?id=" . $bill_invoice_id . "&user_id=" . $dis_id;
					} else {
						$response['url'] = "download_invoice_pdf.php?id=" . $bill_invoice_id . "&user_id=" . $dis_id . "&lng=eng";
						$response['url_hindi'] = "download_invoice_pdf.php?id=" . $bill_invoice_id . "&user_id=" . $dis_id . "&lng=hnd";
					}


					if ($dist_dsr_require == 'Yes') {
						include("cash_bank_effect_class.php");
						if ($pmode == 'Cash' && $cash_amt > 0) {
							$CashCollection = new Collection();
							$collections = $CashCollection->cashcollection($dis_id, $cash_amt, $invoice_date);
						} else if ($pmode == 'Both' && $cash_amt > 0) {
							$CashCollection = new Collection();
							$collections = $CashCollection->cashcollection($dis_id, $cash_amt, $invoice_date);
						} else if (($pmode == 'Online' || $pmode == "Wallet") && $final_amt > 0) {
							$CashCollection = new Collection();
							$collections = $CashCollection->bankcollection($dis_id, $deposit_bank_id, $final_amt, $invoice_date);
						}
					}

					$response['success'] = 1;
					$response['details'] = $sd;
					$response['pmode'] = $pmode;
				} else {
					$response['success'] = 0;
					$response['details'] = "Insertion Error...!!";
				}
			} else {
				$response['success'] = 0;
				$response['details'] = "Insertion Error...!!";
			}
		} else {
			$response['success'] = 0;
			$response['details'] = "Message transaction id already exists!";
		}
	}
} else {
	$response['success'] = 0;
	$response['details'] = "Required Field Missing...!!";
}
echo json_encode($response);
