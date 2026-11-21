<?php
include("../../connect.php");
$response = array();
if (isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['billno']) && isset($_POST['billdate']) && isset($_POST['total_order'])) {
	$temp_id = 1;
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con, "SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if (mysqli_num_rows($disSql) > 0) {
		$disRow = mysqli_fetch_array($disSql);
		if ($disRow['country'] == 'United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d") . " " . date('H:i:sa');
	$cdate = date("Y-m-d");
	$scri = date('H:i:sa');
	$pp_id1 = $_POST['party_id'];
	$billno1 = strtoupper($_POST['billno']);

	$purchase_type = isset($_POST['purchase_type']) ? $_POST['purchase_type'] : 'Manually';
	$billdate1 = $_POST['billdate'];
	$toder = $_POST['total_order'];
	$remark = isset($_POST['remark']) ? $_POST['remark'] : '';
	$uniqueId = uniqid();
	$uniqueId1 = "PR" . strtoupper($uniqueId);

	$pmode = $_POST['pmode'];
	$pmtype = isset($_POST['pmtype']) ? $_POST['pmtype'] : '';
	$cheque_bank = isset($_POST['cheque_bank']) ? $_POST['cheque_bank'] : '';
	$cheque_number = isset($_POST['cheque_number']) ? $_POST['cheque_number'] : '';
	$cheque_date = isset($_POST['cheque_date']) ? $_POST['cheque_date'] : $cdate;
	$pstatus = $_POST['payment_status'];

	$party_number = isset($_POST['party_number']) ? $_POST['party_number'] : '';
	$message_date = isset($_POST['message_date']) ? $_POST['message_date'] : '';
	$message_time = isset($_POST['message_time']) ? $_POST['message_time'] : '';
	$message_amount = isset($_POST['message_amount']) ? $_POST['message_amount'] : '';

	$msg_insert_check = 0;
	if ($purchase_type == 'E-Recharge') {
		$select_message = mysqli_query($con, "select * from `tbl_distributor_purchase_msg` where distributor_id='$ver' and transaction_id='$billno1'");
		if (mysqli_num_rows($select_message) <= 0) {
			$query_message = mysqli_query($con, "insert into tbl_distributor_purchase_msg(`distributor_id`, `transaction_id`, `amount`, `party_phone`, `message_date`, `message_time`, `category`, `insert_date`, `insert_time`, `status`, `complete_date`, `complete_time`)values('$ver','$billno1','$message_amount','$party_number','$message_date','$message_time','LAPU','$cdate','$scri','Complete','$cdate','$scri')");
			$msg_insert_check = 0;
		} else {
			$msg_insert_check = 1;
		}
	}
	if ($msg_insert_check == 0) {
		$json_a = json_decode($toder, true);
		foreach ($json_a as $person_a) {
			$proid = $person_a['pid'];
			$pquanity = $person_a['quantity'];
			$pcgst = $person_a['cgst_amt'];
			$psgst = $person_a['sgst_amt'];
			$pigst = $person_a['igstamt'];
			$pamt = $person_a['total_amount'];
			$proprice = $person_a['purchase_price'];
			$p_disc_amt = $person_a['disc_amount'];
			$pfinal_net_amt = $person_a['net_amount'];
			$cess_amt = isset($person_a['cess_amount']) ? $person_a['cess_amount'] : '0';
			$pay_amt = $person_a['paid_amt'];
			$gst_perc = isset($person_a['gst_perc']) ? $person_a['gst_perc'] : '0';
			$pfreeqty = isset($person_a['free_qty']) ? $person_a['free_qty'] : '0';
			$pbatch = isset($person_a['batch_no']) ? $person_a['batch_no'] : '';
			$pexpiry = isset($person_a['expiry_date']) ? $person_a['expiry_date'] : '';
			$ppacking = isset($person_a['packing']) ? $person_a['packing'] : '';
			$transaction_id = substr(uniqid(rand(), 1), 0, 7) . '_' . uniqid() . '_' . substr(rand(), 1, 3);
			$query = mysqli_query($con, "insert into tbl_distributor_transaction(transaction_id,product_id,distributor_id,quantity, transaction_date,transaction_time,txn_type,total_amount,cgst_amt,sgst_amt,igst_amt,party_id,bill_no,bill_date,bill_time,unique_bill,discount_amt,final_net_amt,cess_amt,remark_detail,product_price,payment_mode,payment_status,pay_amount,bank_wallet_name,payment_txn_id,cheque_txn_date,payment_type,message_txn_id,purchase_type,gst_perc,batch_no,expiry_date,packing,free_qty)values('$transaction_id','$proid','$ver','$pquanity','$cdate','$scri','Add','$pamt','$pcgst','$psgst','$pigst','$pp_id1','$billno1','$billdate1','$scri','$uniqueId1','$p_disc_amt','$pfinal_net_amt','$cess_amt','$remark','$proprice','$pmode','$pstatus','$pay_amt','$cheque_bank','$cheque_number','$cheque_date','$pmtype','$billno1','$purchase_type','$gst_perc','$pbatch','$pexpiry','$ppacking','$pfreeqty')");

			$res11 = mysqli_query($con, "select stock_quantity from tbl_product where status='Active' and distributor_id='$ver' and product_id='$proid'");
			while ($fetch_product11 = mysqli_fetch_assoc($res11)) {
				$temp_quantity_temp = $fetch_product11['stock_quantity'];
				$set_quan = round($temp_quantity_temp + $pquanity, 2);
				$uq1 = mysqli_query($con, "UPDATE tbl_product SET stock_quantity='$set_quan',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");

				$res_stock = mysqli_query($con, "SELECT closing_stock FROM  tbl_distributor_stock where date ='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
				$row_stock =  mysqli_fetch_assoc($res_stock);
				if (mysqli_num_rows($res_stock) > 0) {
					$stock_quantity = $row_stock['closing_stock'];
					$temp_quantity = round($stock_quantity + $pquanity, 2);
					$uq = mysqli_query($con, "UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scri' where date ='$cdate' and distributor_id='$ver' and product_id='$proid'");
				} else {
					$query_stock1 = "SELECT closing_stock FROM  tbl_distributor_stock where date <='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1";
					$res_stock1 = mysqli_query($con, $query_stock1);
					$row_stock1 =  mysqli_fetch_assoc($res_stock1);
					if (mysqli_num_rows($res_stock1) > 0) {
						$stock_quantity = $row_stock1['closing_stock'];
						$temp_quantity = round($stock_quantity + $pquanity, 2);
						$stock_insert = mysqli_query($con, "insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$ver','$proid','$stock_quantity','$temp_quantity','$cdate','$scri')");
					} else {
						$stock_insert = mysqli_query($con, "insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$ver','$proid','0','$pquanity','$cdate','$scri')");
					}
				}
				if ($pfreeqty > 0) {
					$res_stock = mysqli_query($con, "SELECT closing_stock FROM  tbl_distributor_free_stock where date ='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
					if (mysqli_num_rows($res_stock) > 0) {
						$row_stock =  mysqli_fetch_assoc($res_stock);
						$stock_quantity = $row_stock['closing_stock'];
						$temp_quantity = round($stock_quantity + $pfreeqty, 2);
						$uq = mysqli_query($con, "UPDATE tbl_distributor_free_stock SET closing_stock='$temp_quantity',time='$scri' where date ='$cdate' and distributor_id='$ver' and product_id='$proid'");
						$uq1 = mysqli_query($con, "UPDATE tbl_product SET free_stock='$temp_quantity',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
					} else {
						$res_stock1 = mysqli_query($con, "SELECT closing_stock FROM  tbl_distributor_free_stock where date <='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
						if (mysqli_num_rows($res_stock1) > 0) {
							$row_stock1 =  mysqli_fetch_assoc($res_stock1);
							$stock_quantity = $row_stock1['closing_stock'];
							$temp_quantity = round($stock_quantity + $pfreeqty, 2);
							$stock_insert = mysqli_query($con, "INSERT IGNORE INTO tbl_distributor_free_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$ver','$proid','$stock_quantity','$temp_quantity','$cdate','$scri')");
							$uq1 = mysqli_query($con, "UPDATE tbl_product SET free_stock='$temp_quantity',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
						} else {
							$stock_insert = mysqli_query($con, "INSERT IGNORE INTO tbl_distributor_free_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$ver','$proid','0','$pfreeqty','$cdate','$scri')");
							$uq1 = mysqli_query($con, "UPDATE tbl_product SET free_stock='$pfreeqty',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
						}
					}
				}
			}
		}

		if ($uq1) {
			$response['success'] = '1';
			$response['details'] = "Stock successfully uploaded!";
		} else {
			$response['success'] = 0;
			$response['details'] = "Insertion Error...!!";
		}
	} else {
		$response['success'] = 0;
		$response['details'] = "Duplicate Transaction Id...!!";
	}
} else {
	$response['success'] = '0';
	$response['details'] = "Required field missing";
}
echo json_encode($response);
