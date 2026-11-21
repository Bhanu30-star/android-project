<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['billno']) && isset($_POST['billdate']) && isset($_POST['total_order']))
{
	$temp_id=1;
	$ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d")." ".date('H:i:sa');
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');
	$pp_id1=$_POST['party_id'];
	$billno1=strtoupper($_POST['billno']);
	$billdate1=$_POST['billdate'];
	$toder = $_POST['total_order'];
	$uniqueId=uniqid();
	$uniqueId1="CN".strtoupper($uniqueId);
	$adjust_return_amount=0;
	$pmode=$_POST['pmode'];
	$disremark=isset($_POST['remark']) ? $_POST['remark'] : '';
	
	$tcs_perc = isset($_POST['tcs_perc']) ? $_POST['tcs_perc'] : '0';
	$tcs_applicable = isset($_POST['tcs_applicable']) ? $_POST['tcs_applicable'] : 'No';
	$tcs_Amt = isset($_POST['tcs_Amt']) ? $_POST['tcs_Amt'] : '0';
	$billno_autog_val=strtoupper($_POST['bill_no_autog']);
	if($billno1==$billno_autog_val)
	{
		$select_order = mysqli_query($con, "select credit_sequence from `tbl_sequence` where distributor_id='$ver'");
		$select_row =  mysqli_fetch_assoc($select_order);
		if (mysqli_num_rows($select_order) > 0) {
			$uq_sequence = mysqli_query($con, "UPDATE tbl_sequence SET credit_sequence='$billno_autog_val',last_update_datetime='$da' where distributor_id='$ver'");
		}
		else
		{
			$uq_sequence = mysqli_query($con, "INSERT IGNORE INTO tbl_sequence(distributor_id,credit_sequence,last_update_datetime)values('$ver','$billno_autog_val','$da')");
		}
	}
	
	
	
	
	$adjust_return_amount=$adjust_return_amount+$tcs_Amt;
	if($pmode=="Return Stock")
	{
		$json_a=json_decode($toder, true);     
		foreach ($json_a as $person_a)
		{
			$proid=$person_a['pid'];
			$pquanity=$person_a['quantity'];
			$pcgst=$person_a['cgst_amt'];
			$psgst=$person_a['sgst_amt'];
			$pigst=$person_a['igstamt'];
			$pamt=$person_a['total_amount'];
			$proprice=$person_a['purchase_price'];
			$pnetamt=$person_a['net_amount'];
			$probagtype = isset($person_a['pro_bagtype']) ? $person_a['pro_bagtype'] : '0';
			$probagqty = isset($person_a['pro_bagqty']) ? $person_a['pro_bagqty'] : '0';
			
			$adjust_return_amount=$adjust_return_amount+$pnetamt;
			$query = mysqli_query($con,"INSERT INTO `tbl_party_credit_note`(`distributor_id`, `party_id`, `bill_no`, `product_id`, `quantity`, `product_price`, `total_amount`, `cgst_amt`, `sgst_amt`, `igst_amt`, `final_net_amt`, `bill_date`, `bill_time`, `transaction_date`, `transaction_time`, `unique_bill`,`remark`,`is_tcs`,`tcs_percentage`,`tcs_amount`,`bag_type`,`bag_qty`) VALUES ('$ver','$pp_id1','$billno1','$proid','$pquanity','$proprice','$pamt','$pcgst','$psgst','$pigst','$pnetamt','$billdate1','$scri','$cdate','$scri','$uniqueId1','$disremark','$tcs_applicable','$tcs_perc','$tcs_Amt','$probagtype','$probagqty')");

			$res_stock = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date ='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
			$row_stock =  mysqli_fetch_assoc($res_stock);
			if(mysqli_num_rows($res_stock)>0)
			{
				$stock_quantity=$row_stock['closing_stock'];
				$temp_quantity=round($stock_quantity+$pquanity,2);
				$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scri' where date ='$cdate' and distributor_id='$ver' and product_id='$proid'");
				$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
			}
			else
			{
				$res_stock1 = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date <='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
				$row_stock1 =  mysqli_fetch_assoc($res_stock1);
				if(mysqli_num_rows($res_stock1)>0)
				{
					$stock_quantity=$row_stock1['closing_stock'];
					$temp_quantity=round($stock_quantity+$pquanity,2);
					$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$ver','$proid','$stock_quantity','$temp_quantity','$cdate','$scri')");
					$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
				}
			}
		}
		
		$res_profit = mysqli_query($con, "SELECT * FROM  tbl_product_profit_daywise where distributor_id='$ver' and product_id='$proid' ORDER BY `id` DESC LIMIT 1");
		if (mysqli_num_rows($res_profit) > 0) 
		{
			$row_step =  mysqli_fetch_assoc($res_profit);
			$final_balance_qty=$row_step['balance_qty']+$pquanity;
			$final_avg_price=$row_step['avg_price'];
			$stock_insert=mysqli_query($con,"INSERT INTO `tbl_product_profit_daywise`(`distributor_id`, `product_id`, `qty`, `purchase_price`,`sale_price`,`avg_price`,`balance_qty`,`profit_loss_per_qty`,`total_profit`,`date`,`time`,`type`) VALUES ('$ver','$proid','$pquanity','$proprice','','$final_avg_price','$final_balance_qty','','','$cdate','$scri','Credit Note')");
		}
		
		include("sale-purchase-balance-effect-class.php");
		$CashCollection=new Collectionbalance();
		$collections=$CashCollection->saleminuscollection($ver,$adjust_return_amount,$billdate1,$pp_id1);
	}
	else
	{
		$d_amt=$_POST['damt'];
		$query = mysqli_query($con,"INSERT INTO `tbl_party_credit_note`(`distributor_id`, `party_id`, `bill_no`,`total_amount`, `final_net_amt`,`bill_date`, `bill_time`, `transaction_date`, `transaction_time`, `unique_bill`,`credit_note_type`,`remark`) VALUES ('$ver','$pp_id1','$billno1','$d_amt','$d_amt','$billdate1','$scri','$cdate','$scri','$uniqueId1','Direct','$disremark')");
		include("sale-purchase-balance-effect-class.php");
		$CashCollection=new Collectionbalance();
		$collections=$CashCollection->saleminuscollection($ver,$d_amt,$billdate1,$pp_id1);
	}
	$response['success']='1';
	$response['details']="Credit Note Successful Generated";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>