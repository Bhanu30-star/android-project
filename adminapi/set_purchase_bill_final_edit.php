<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['total_order']) && isset($_POST['unique_bill']))
{
	$month = date('m');
	if ($month > 4) {
		$fys = date('Y') . "-04-01";
		$fye = date('Y', strtotime('+1 year')) . "-03-31";
	} else {
		$fys = date('Y', strtotime('-1 year')) . "-04-01";
		$fye = date('Y') . "-03-31";
	}
	$da  = date("Y-m-d") . " " . date('H:i:sa');
	$cdate = date("Y-m-d");
	$scri = date('H:i:sa');
	$scro = date("H:i:s");
	$mydate = $cdate . " " . $scro;
	
	$session_dist_ver = $_POST['distributor_id'];
	$pmode = $_POST['pmode'];
	$pmtype = $_POST['pmtype'];
	$net_amount = $_POST['net_final_amt'];
	$tcs_amount = $_POST['tcs_Amt'];
	$dist_dsr_require = $_POST['dist_dsr_require'];
	$tcs_applicable = $_POST['tcs_applicable'];
	$pp_id1 = $_POST['party_id'];
	$dist_gst_config = $_POST['billtype_value'];
	$billno1 = strtoupper($_POST['billno']);
	$billdate1 = $_POST['billdate'];
	if ($tcs_applicable == "") {
		$tcs_applicable = "No";
	}
	$PurchaseRemark = $_POST['remark'];
	$labouramt = isset($_POST['labouramt']) ? $_POST['labouramt'] : '0';
	$freightamt = isset($_POST['freightamt']) ? $_POST['freightamt'] : '0';
	$otherexpamt = isset($_POST['otherexpamt']) ? $_POST['otherexpamt'] : '0';
	$amount = $_POST['total_final_amt'];
	$disc_amt = $_POST['calculate_disc_amt'];
	$cheque_number = isset($_POST['cheque_number']) ? $_POST['cheque_number'] : '';
	$cheque_date = isset($_POST['cheque_date']) ? $_POST['cheque_date'] : '';
	$credit_days = isset($_POST['credit_days']) ? $_POST['credit_days'] : '0';
	$cheque_bank = isset($_POST['cheque_bank']) ? $_POST['cheque_bank'] : '';
	$cheq_bank_id = isset($_POST['cheque_bank_id']) ? $_POST['cheque_bank_id'] : '';
	$uniqueId1 = $_POST['unique_bill'];
	$pstatus=$_POST['payment_status'];
	
	$res_cart=mysqli_query($con,"select transaction_date from tbl_distributor_transaction where distributor_id='$session_dist_ver' and txn_type='Add' and unique_bill='$uniqueId1'");
	while($fetch=mysqli_fetch_assoc($res_cart))
    {
		$cdate=$fetch['transaction_date'];
	}
	$tcs_query = mysqli_query($con, "select * from tbl_bthawk_tcs_tds_details where name='tds' LIMIT 1");
	$fetch_tcs = mysqli_fetch_assoc($tcs_query);
	$tcs_value = $fetch_tcs['value'];
	$total_final_amt = $discount_on_total = 0;
	
	include("cancel-purchasebill-foredit.php");
	$CancelCollection = new Collection_cancel();
	$collections = $CancelCollection->admincollection($session_dist_ver, $uniqueId1, $pp_id1);
	if ($collections == 1) 
	{
		include("../../connect.php");
		$res_charges = mysqli_query($con, "INSERT INTO `tbl_distributor_transaction_charges`(`distributor_id`, `party_id`, `bill_no`, `unique_bill`, `bill_date`, `labour_charges`, `freight_charges`, `other_expenses`, `total_amt`, `tcs_percentage`, `is_tcs`,`tcs_amt`, `disc_amt`, `net_amt`, `status`) VALUES ('$session_dist_ver','$pp_id1','$billno1','$uniqueId1','$billdate1','$labouramt','$freightamt','$otherexpamt','$amount','$tcs_value','$tcs_applicable','$tcs_amount','$disc_amt','$net_amount','Complete')");
	
		$toder = $_POST['total_order'];
		$json_a1=json_decode($toder, true);     
		foreach ($json_a1 as $person_a)
		{
			$proid=$person_a['product_id'];
			$pquanity=$person_a['quantity'];
			$pcgst=isset($person_a['cgst_amt']) ? $person_a['cgst_amt'] : '0';
			$psgst=isset($person_a['sgst_amt']) ? $person_a['sgst_amt'] : '0';
			$pigst=isset($person_a['igst_amt']) ? $person_a['igst_amt'] : '0';
			$temp_total_amt=$person_a['total_amt'];
			$discount_type=$person_a['discount_type'];
			$disc_type_amt=$person_a['disc_type_amt'];
			$pdiscount=$person_a['disc_amount'];
			$pnetamt=$person_a['net_amount'];
			$pcess=isset($person_a['cess_amount']) ? $person_a['cess_amount'] : '0';
			$probagtype=isset($person_a['probag']) ? $person_a['probag'] : '0';
			$probagqty=isset($person_a['probagqty']) ? $person_a['probagqty'] : '0';
			$pfree_quanity=isset($person_a['free_qty']) ? $person_a['free_qty'] : '0';
			$proprice=$person_a['purchase_price'];
			$pay_amt=$person_a['paid_amt'];
			$temp_explode=$person_a['imei_detail'];
			$pro_type_check=$person_a['pro_type_check'];
			$gst_perc=isset($person_a['gst_perc']) ? $person_a['gst_perc'] : '0';
			$temp_explode1=explode(",",$temp_explode);
			
			$transaction_id = substr(uniqid(rand(), 1), 0, 7) . '_' . uniqid() . '_' . substr(rand(), 1, 3);
			$query = mysqli_query($con, "INSERT IGNORE INTO tbl_distributor_transaction(transaction_id,product_id,distributor_id,quantity, transaction_date, transaction_time, txn_type,total_amount,cgst_amt,sgst_amt,party_id, bill_no,bill_date,bill_time, unique_bill,cess_amt,discount_amt,final_net_amt,remark_detail,igst_amt, product_price, payment_mode,payment_status,pay_amount,bank_wallet_name,payment_txn_id,cheque_txn_date,payment_type,gst_perc,bag_type,bag_qty,bill_type,disc_type,disc_val,bank_id,discount_on_total,src)values('$transaction_id','$proid','$session_dist_ver','$pquanity','$cdate','$scri','Add','$temp_total_amt','$pcgst','$psgst','$pp_id1','$billno1','$billdate1','$scri','$uniqueId1','$pcess','$pdiscount','$pnetamt','$PurchaseRemark','$pigst','$proprice','$pmode','$pstatus','$pay_amt','$cheque_bank','$cheque_number','$cheque_date','$pmtype','$gst_perc','$probagtype','$probagqty','$dist_gst_config','$discount_type','$disc_type_amt','$cheq_bank_id','0','Admin')");
				
			if($pro_type_check=="Mobile")
			{
				for($jk=0;$jk<sizeof($temp_explode1);$jk++)
				{
					$insertQry=mysqli_query($con,"INSERT INTO `tbl_product_serialno`(`product_id`, `IMEI`, `insert_date`, `insert_time`,`status`,`unique_bill`) VALUES ('$proid','$temp_explode1[$jk]','$cdate','$scri','Available','$uniqueId1')");
				}
			}
			
			$res_stock = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date ='$cdate' and distributor_id='$session_dist_ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
			$row_stock =  mysqli_fetch_assoc($res_stock);
			if(mysqli_num_rows($res_stock)>0)
			{
				$stock_quantity=$row_stock['closing_stock'];
				$temp_quantity=round($stock_quantity+$pquanity,2);
				$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scri' where date ='$cdate' and distributor_id='$session_dist_ver' and product_id='$proid'");
				$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$session_dist_ver'");
			}
			else
			{
				$query_stock1="SELECT closing_stock FROM  tbl_distributor_stock where date <='$cdate' and distributor_id='$session_dist_ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1";
				$res_stock1 = mysqli_query($con,$query_stock1);
				$row_stock1 =  mysqli_fetch_assoc($res_stock1);
				if(mysqli_num_rows($res_stock1)>0)
				{
					$stock_quantity=$row_stock1['closing_stock'];
					$temp_quantity=round($stock_quantity+$pquanity,2);
					$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock, date,time)values('$session_dist_ver','$proid','$stock_quantity','$temp_quantity','$cdate','$scri')");
					$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$session_dist_ver'");
				}
				else
				{
					$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock,date,time)values('$session_dist_ver','$proid','0','$pquanity','$cdate','$scri')");
					$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$pquanity',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$session_dist_ver'");
				}
			}
			
			
			$res_profit = mysqli_query($con, "SELECT * FROM  tbl_product_profit_daywise where distributor_id='$session_dist_ver' and product_id='$proid' ORDER BY `id` DESC LIMIT 1");
			if (mysqli_num_rows($res_profit) > 0) {
				$row_step =  mysqli_fetch_assoc($res_profit);
				$total_avg_amt = $row_step['avg_price'] * $row_step['balance_qty'];
				$total_avg_amt = $total_avg_amt + ($proprice * $pquanity);
				$final_balance_qty = $row_step['balance_qty'] + $pquanity;
				$final_avg_price = round($total_avg_amt / $final_balance_qty, 2);
				$stock_insert = mysqli_query($con, "INSERT INTO `tbl_product_profit_daywise`(`distributor_id`, `product_id`, `qty`, `purchase_price`,`sale_price`,`avg_price`, `balance_qty`,`profit_loss_per_qty`,`total_profit`,`date`,`time`,`type`) VALUES ('$session_dist_ver','$proid','$pquanity','$proprice','','$final_avg_price','$final_balance_qty','','','$cdate','$scri','Purchase')");
			} else {
				$stock_insert = mysqli_query($con, "INSERT INTO `tbl_product_profit_daywise`(`distributor_id`,`product_id`,`qty`, `purchase_price`,`sale_price`,`avg_price`, `balance_qty`,`profit_loss_per_qty`,`total_profit`,`date`,`time`,`type`) VALUES ('$session_dist_ver','$proid','$pquanity','$proprice','','$proprice','$pquanity','','','$cdate','$scri','Purchase')");
			}
			
			
		}
			
		if ($uq1) 
		{
			if($pmode=='Credit')
			{
				include_once("sale-purchase-balance-effect-class.php");
				$CashCollection=new Collectionbalance();
				$collections=$CashCollection->purchasecollection($session_dist_ver,$net_amount,$billdate1,$pp_id1);
			}
				
			if($actual_dsr_requirement=="Yes")
			{
				include_once("cash_bank_effect_class.php");
				if ($pmode == 'Cash') {
					$CashCollection = new Collection();
					$collections = $CashCollection->purchasecashcollection($session_dist_ver, $net_amount, $cdate);
				} else if ($pmode == 'Online') {
					$CashCollection = new Collection();
					$collections = $CashCollection->purchasebankcollection($session_dist_ver, $cheq_bank_id, $net_amount, $cdate);
				}
			}
			$response['success']='1';
			$response['details']="Purchase Edit Successfully";
		}
		else
		{
			$response['success']='0';
			$response['details']="Something Went Wrong. Bill Can't be Edited.";
		}
	}
	else
	{
		$response['success']='0';
		$response['details']="Something Went Wrong. Bill Can't be Cancel.";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>