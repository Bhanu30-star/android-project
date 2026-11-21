<?php
include("../../connect.php");
$response = array();
if(isset($_POST['bill_txn_id']) && isset($_POST['distributor_id']))
{
	$bodydata = print_r($_POST, true);
	$session_dist_ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$query_log=mysqli_query($con,"insert into tbl_sale_log_data(`distributor_id`,`transaction_date`,`log_data`,`source`,`edit_flag`)values('$session_dist_ver','$da','$bodydata','Admin','Yes')");
	$scri =$da." ".$scro;
	$billtxn_id=$_POST['bill_txn_id'];
	$dist_dsr_require=$_POST['dist_dsr_require'];
	$pp_id1=$_POST['key_pid'];
	$pp_gstin=$_POST['party_gstin'];
	$client1 =$_POST['key_uid'];
	$pmode = $_POST['payment_mode'];
	$tcs_amount=$_POST['tcs_amount'];
	$check_product_type = isset($_POST['serial_bill']) ? $_POST['serial_bill'] : '';
	$reverse_chargeval = $_POST['reverse_charge_val'];
	$credit_days = isset($_POST['credit_days']) ? $_POST['credit_days'] : '0';
	$brokerno = $_POST['brokerno'];
	$bill_crate_val = isset($_POST['billcrateval']) ? $_POST['billcrateval'] : '0';
	$bill_bottle_val = isset($_POST['billbottleval']) ? $_POST['billbottleval'] : '0';
	$docket_no = isset($_POST['docket_no']) ? $_POST['docket_no'] : '';
	$courier_agency = isset($_POST['courier_agency']) ? $_POST['courier_agency'] : '';
	$courier_date = isset($_POST['courier_date']) ? $_POST['courier_date'] : '';
	$purchase_orderno = $_POST['purchase_orderno'];
	if ($pp_gstin == '')
		$reverse_chargeval = 'N';
	if ($servicetype == 'Manual')
		$courier_facility = 'No';
	else
		$courier_facility = 'Yes';
	$toder = $_POST['product_order_json'];
	$tcs_applicable ="No";
	if($tcs_amount>0) { $tcs_applicable ="Yes"; }
	$labouramt=$_POST['labouramt'];
	$freightamt=$_POST['freightamt'];
	$otherexpamt=$_POST['otherexpamt'];
	$cheque_bank_deposit = isset($_POST['cheque_bank_deposit']) ? $_POST['cheque_bank_deposit'] : '';
	$pmtype = isset($_POST['pmtype']) ? $_POST['pmtype'] : '';
	$shipping_address = mysqli_real_escape_string($con, $_POST['shipping_address_value']);
	$remark = mysqli_real_escape_string($con,$_POST['remark']);
	$bank_name = isset($_POST['cheque_bank']) ? $_POST['cheque_bank'] : '';
	$cheque_no = isset($_POST['cheque_number']) ? $_POST['cheque_number'] : '';
	$cheque_date = isset($_POST['cheque_date']) ? $_POST['cheque_date'] : '';
	
	$cal_total_amt=round($_POST['amount']+$labouramt+$freightamt+$otherexpamt,2);
	$disc_amt = $_POST['disc_amt'];
	$cess_amt_final = $_POST['cess_amount'];
	$disc_bill_amt = isset($_POST['bill_discount_amt']) ? $_POST['bill_discount_amt'] : '0';
	$final_amt_val=$_POST['final_amt'];
	$round_off_amt=$_POST['round_off_amt'];
	
	$dist_gst_config=$_POST['gstconfig'];

	$pstatus=$_POST['payment_status'];
	if ($pmode == "Both") {
		$cash_amt = $_POST['cash_amount'];
		$cheque_amt = $_POST['cheque_amount'];
	} else if ($pmode == "Cash") {
		$cash_amt = $final_amt_val;
		$cheque_amt = 0;
	} else {
		$cash_amt = 0;
		$cheque_amt = $final_amt_val;
	}
	
	$res_final = mysqli_query($con,"select * from tbl_party_transaction where transaction_id='$billtxn_id'");
	if(mysqli_num_rows($res_final)>0)
	{
		$fetch_res=mysqli_fetch_assoc($res_final);
		$prev_pay_mode = $fetch_res['payment_mode'];
		$da_txn = $fetch_res['transaction_date'];
		$final_add_date_new = $fetch_res['invoice_add_date'];
		$billsource1 = $fetch_res['source'];
		if ($fetch_res['invoice_add_date'] == '0000-00-00')
			$final_add_date_new = $da_txn;
		if ($billsource1 == '')
			$client1 = $fetch_res['transaction_from'];
		$pre_party_id = $fetch_res['transaction_to'];
		
		include("cancel-bill-fmcg-serialno-foredit.php");
		if ($billsource1 != '') {
			$CancelCollection = new Collection_cancel();
			$collections = $CancelCollection->admincollection($session_dist_ver, $billtxn_id);
		} else {
			$CancelCollection = new Collection_cancel();
			$collections = $CancelCollection->fsecollection($session_dist_ver, $billtxn_id);
		}
		
		if ($collections == 1)
		{
			include("../../connect.php");
			$uq_sequence11=mysqli_query($con,"UPDATE tbl_party_transaction SET transaction_from='$client1',transaction_to='$pp_id1',total_amount='$cal_total_amt', payment_mode='$pmode',payment_status='$pstatus',bank_name='$bank_name',cheque_no='$cheque_no',cash_amount='$cash_amt',cheque_amount='$cheque_amt',cheque_date='$cheque_date', disc_amt='$disc_amt',final_amt='$final_amt_val',cess_amount='$cess_amt_final',round_off_amt='$round_off_amt', discount_on_total='$disc_bill_amt',party_gstin='$pp_gstin', labour_charges='$labouramt',freight_charges='$freightamt',other_expenses='$otherexpamt',gst_configure='$dist_gst_config',tcs_amount='$tcs_amount',is_tcs='$tcs_applicable',final_amt_w_tcs='$final_amt_val',bill_editable='Yes',bank_id='$cheque_bank_deposit',payment_type='$pmtype',remark='$remark',reverse_charge='$reverse_chargeval',shipping_address='$shipping_address',credit_days='$credit_days',courier_facility='$courier_facility', reference_no='$docket_no', courier_date='$courier_date',courier_company='$courier_agency',broker_no='$brokerno',order_id='$purchase_orderno',order_id='$purchase_orderno' where transaction_id='$billtxn_id'");
			$res_reverse=mysqli_query($con,"update `tbl_retailer_returnable_master` set bottle_qty='$bill_bottle_val',crate_qty='$bill_crate_val' where transaction_id='$billtxn_id'");
		
			$json_a=json_decode($toder, true);     
			foreach ($json_a as $fetch_product11)
			{
				$prodid=$fetch_product11['pid'];
				$prodname=$fetch_product11['pname'];
				$ordquantiy=$fetch_product11['quantity'];
				$probagtype = isset($fetch_product11['pro_bagtype']) ? $fetch_product11['pro_bagtype'] : '0';
				$probagqty = isset($fetch_product11['pro_bagqty']) ? $fetch_product11['pro_bagqty'] : '0';
				$proprice=$fetch_product11['pro_price'];
				$pro_discount = isset($fetch_product11['pro_discount']) ? $fetch_product11['pro_discount'] : '0';
				$discount_percentage = isset($fetch_product11['discount_percen']) ? $fetch_product11['discount_percen'] : '0';
				$cgstamt = isset($fetch_product11['cgst_amt']) ? $fetch_product11['cgst_amt'] : '';
				$sgstamt = isset($fetch_product11['sgst_amt']) ? $fetch_product11['sgst_amt'] : '';
				$igstamt = isset($fetch_product11['igstamt']) ? $fetch_product11['igstamt'] : '';
				$cessamt = isset($fetch_product11['cess_final_amt']) ? $fetch_product11['cess_final_amt'] : '';
				$cess_percentage = isset($fetch_product11['cess_percentage']) ? $fetch_product11['cess_percentage'] : '';
				$pro_gst_perc = isset($fetch_product11['gst_perc']) ? $fetch_product11['gst_perc'] : '0';
				$pur_total_amt = isset($fetch_product11['pur_total_amt']) ? $fetch_product11['pur_total_amt'] : '0';
				$pur_taxable_amt = isset($fetch_product11['pur_taxable_amt']) ? $fetch_product11['pur_taxable_amt'] : '0';
				$pur_inventory = isset($fetch_product11['maintain_inventory']) ? $fetch_product11['maintain_inventory'] : 'Yes';
				$sale_unit = isset($fetch_product11['sale_unit']) ? $fetch_product11['sale_unit'] : '';
				$p_imei_no = isset($fetch_product11['serial']) ? $fetch_product11['serial'] : '';
				$consume_flag = isset($fetch_product11['consume_flag']) ? $fetch_product11['consume_flag'] : 'No';
				$profree_flag = isset($fetch_product11['profree_flag']) ? $fetch_product11['profree_flag'] : '';
				$profree_product_id = isset($fetch_product11['profree_product_id']) ? $fetch_product11['profree_product_id'] : '';
				$cartmrp = isset($fetch_product11['cartmrp']) ? $fetch_product11['cartmrp'] : '0';
				
				$query2 = mysqli_query($con, "INSERT into tbl_party_transaction_detail( transaction_id,product_id,product_name,quantity,CGST_amount,SGST_amount, product_price,discount_percentage,cess_pc_amt,cess_percentage,cess_final_amt,product_disc,dis_type,IGST_amount,gst_perc,product_total_amt,taxable_amount,bag_type,bag_qty, consume_detail,sale_unit,free_flag, free_product_id,MRP,IMEI_NO) values('$billtxn_id','$prodid','$prodname','$ordquantiy', '$cgstamt','$sgstamt','$proprice', '$discount_percentage','0','$cess_percentage','$cessamt','$pro_discount', '$d_type', '$igstamt','$pro_gst_perc','$pur_total_amt','$pur_taxable_amt','$probagtype','$probagqty','No','$sale_unit','$profree_flag','$profree_product_id','$cartmrp','$p_imei_no')");
					
				
				if($pur_inventory=="Yes")
				{
					if($fetch_res['source']=="Web" || $fetch_res['source']=="Admin")
					{
						$res_stock = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date ='$final_add_date_new' and distributor_id='$session_dist_ver' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
						if(mysqli_num_rows($res_stock)>0)
						{
								$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$actual_add_qty',2) where date ='$final_add_date_new' and distributor_id='$session_dist_ver' and product_id='$prodid'");
								$uq1=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$actual_add_qty',2),opening_stock=round(opening_stock-'$actual_add_qty',2) where date >'$final_add_date_new' and distributor_id='$session_dist_ver' and product_id='$prodid'");
								$uq2=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity-'$actual_add_qty',2),tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$session_dist_ver'");
						}
						else
						{
							$res_stock1 = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date <='$final_add_date_new' and distributor_id='$session_dist_ver' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
							if(mysqli_num_rows($res_stock1)>0)
							{
								$row_stock1 =  mysqli_fetch_assoc($res_stock1);
								$stock_quantity=$row_stock1['closing_stock'];
								$temp_quantity=round($stock_quantity-$ordquantiy,2);
								$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id, opening_stock, closing_stock, date,time)values('$session_dist_ver','$prodid','$stock_quantity','$temp_quantity','$final_add_date_new','$scro')");
								$uq1=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$actual_add_qty',2), opening_stock = round(opening_stock-'$actual_add_qty',2) where date >'$final_add_date_new' and distributor_id='$session_dist_ver' and product_id='$prodid'");
								$uq2=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity-'$actual_add_qty',2),tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$session_dist_ver'");
							}
							else
							{
								$temp_quantity=$ordquantiy;
								$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id, opening_stock, closing_stock, date,time)values('$session_dist_ver','$prodid','0','-$temp_quantity','$final_add_date_new','$scro')");
								$uq1=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$temp_quantity',2), opening_stock= round(opening_stock-'$temp_quantity',2) where date >'$final_add_date_new' and distributor_id='$session_dist_ver' and product_id='$prodid'");
								$uq2=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity-'$temp_quantity',2),tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$session_dist_ver'");
							}
						}
					}
					else
					{
						$res_stock = mysqli_query($con,"SELECT * FROM  tbl_user_stock where date ='$final_add_date_new' and user_id='$client1' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
						if(mysqli_num_rows($res_stock)>0)
						{
							$uq=mysqli_query($con,"UPDATE tbl_user_stock SET quantity=round(quantity-'$actual_add_qty',2) where date ='$final_add_date_new' and user_id='$client1' and product_id='$prodid'");
							$uq1=mysqli_query($con,"UPDATE tbl_user_stock SET quantity=round(quantity-'$actual_add_qty',2), opening_stock = round(opening_stock-'$actual_add_qty',2) where date >'$final_add_date_new' and user_id='$client1' and product_id='$prodid'");
						}
						else
						{
							$res_stock1 = mysqli_query($con,"SELECT * FROM  tbl_user_stock where date <='$final_add_date_new' and user_id='$client1' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
							if(mysqli_num_rows($res_stock1)>0)
							{
								$row_stock1 =  mysqli_fetch_assoc($res_stock1);
								$stock_quantity=$row_stock1['quantity'];
								$temp_quantity=round($stock_quantity-$ordquantiy,2);
								$stock_insert=mysqli_query($con,"insert into tbl_user_stock(user_id,product_id,opening_stock, quantity,date)values('$client1','$prodid','$stock_quantity','$temp_quantity','$final_add_date_new')");
								$uq1=mysqli_query($con,"UPDATE tbl_user_stock SET quantity=round(quantity-'$actual_add_qty',2), opening_stock=round(opening_stock-'$actual_add_qty',2) where date >'$final_add_date_new' and user_id='$client1' and product_id='$prodid'");
							}
							else
							{
								$temp_quantity=$ordquantiy;
								$stock_insert=mysqli_query($con,"insert into tbl_user_stock(user_id,product_id,opening_stock, quantity,date)values('$client1','$prodid','0','-$temp_quantity','$final_add_date_new')");
								$uq1=mysqli_query($con,"UPDATE tbl_user_stock SET quantity=round(quantity-'$temp_quantity',2),opening_stock= round(opening_stock-'$temp_quantity',2) where date >'$final_add_date_new' and user_id='$client1' and product_id='$prodid'");
							}
						}
					}
				}
			}
				
			if ($query2) 
			{
				if ($pmode == 'Credit') {
					include_once "sale-purchase-balance-effect-class.php";
					$CashCollection = new Collectionbalance();
					$collections = $CashCollection->salecollection($session_dist_ver, $final_amt_val, $da_txn, $pp_id1);
				}
				if ($dist_dsr_require == 'Yes') {
					include_once "cash_bank_effect_class.php";
					if ($pmode == 'Cash' && $final_amt_val > 0) {
						$CashCollection = new Collection();
						$collections = $CashCollection->cashcollection($session_dist_ver, $final_amt_val, $da_txn);
					} else if ($pmode == 'Both' && $cash_amt != 0) {
						$CashCollection = new Collection();
						$collections = $CashCollection->cashcollection($session_dist_ver, $cash_amt, $da_txn);
					} else if (($pmode == 'Online' || $pmode == "Wallet") && $final_amt_val > 0) {
						$CashCollection = new Collection();
						$collections = $CashCollection->bankcollection($session_dist_ver, $cheque_bank_deposit, $final_amt_val, $da_txn);
					}
				}
				$response['success']='1';
				$response['details']="Bill Successfully Updated";
				
				$response['url'] = "download_invoice_pdf.php?id=" . $billtxn_id . "&user_id=" . $session_dist_ver . "&lng=eng";
				$response['url_hindi'] = "download_invoice_pdf.php?id=" . $billtxn_id . "&user_id=" . $session_dist_ver . "&lng=hnd";
				
			}
			else
			{	
				$response['success']='0';
				$response['details']="Error At The Time of Product Audit Trail !!";
			}
		}
		else
		{
			$response['success']='0';
			$response['details']="Error At The Time of Bill Audit Trail !!";
		}
	}
	else
	{
		$response['success']='0';
		$response['details']="Bill Detail Not Valid. !!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>