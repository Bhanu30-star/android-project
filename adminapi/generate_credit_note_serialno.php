<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['bill_no']) && isset($_POST['bill_date']) && isset($_POST['total_order']))
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
	$billno1=strtoupper($_POST['bill_no']);
	$billdate1=$_POST['bill_date'];
	$toder = $_POST['total_order'];
	$actual_bill_type=$_POST['gst_configure'];
	$uniqueId=uniqid();
	$uniqueId1="CN".strtoupper($uniqueId);
	$adjust_return_amount=0;
	$pmode=$_POST['pmode'];
	$disremark=isset($_POST['remark']) ? $_POST['remark'] : '';
	$tcs_perc = isset($_POST['tcs_perc']) ? $_POST['tcs_perc'] : '0';
	$tcs_applicable = isset($_POST['tcs_applicable']) ? $_POST['tcs_applicable'] : 'No';
	$tcs_Amt = isset($_POST['tcs_Amt']) ? $_POST['tcs_Amt'] : '0';
	$json_a=json_decode($toder, true);  
	$adjust_return_amount=$adjust_return_amount+$tcs_Amt;
	foreach ($json_a as $person_a)
	{
		$proid=$person_a['product_id'];
		$temp_quantity_count=$person_a['quantity'];
		$t_selectimei=$person_a['imei_no'];
		$temp_3=isset($person_a['cgst_amt']) ? $person_a['cgst_amt'] : '0';
		$temp_4=isset($person_a['sgst_amt']) ? $person_a['sgst_amt'] : '0';
		$temp_5=isset($person_a['igst_amt']) ? $person_a['igst_amt'] : '0';
		$total_pamt=$person_a['total_amount'];
		$cal_final_amt=$person_a['net_amount'];
		$pro_product_price=$person_a['product_price'];
		$adjust_return_amount=$adjust_return_amount+$cal_final_amt;
		$uploaddata1=trim($t_selectimei);
		$temp_imeino=explode(',',$uploaddata1);
		for($jk=0;$jk<sizeof($temp_imeino);$jk++)
		{
			if($temp_imeino[$jk]!='')
			{
				$insertQry=mysqli_query($con,"INSERT INTO `tbl_party_credit_note_deatil`(`product_id`, `IMEI`, `unique_bill`, `insert_date`, `insert_time`) VALUES ('$proid','$temp_imeino[$jk]','$uniqueId1','$cdate','$scri')");
				if($insertQry)
					$insertQry=mysqli_query($con,"update `tbl_product_serialno` set status='Available',user_id='0',assign_date='',saleout_date='' where IMEI like '%$temp_imeino[$jk]' and product_id='$proid'");
			}
		}
		$query = mysqli_query($con,"INSERT INTO `tbl_party_credit_note`(`distributor_id`, `party_id`, `bill_no`, `product_id`, `quantity`, `product_price`, `total_amount`, `cgst_amt`, `sgst_amt`, `igst_amt`, `final_net_amt`, `bill_date`, `bill_time`, `transaction_date`,`transaction_time`, `unique_bill`,`remark`,`bill_type`,`creditnote_billtype`,`is_tcs`, `tcs_percentage`, `tcs_amount`) VALUES ('$ver','$pp_id1','$billno1','$proid','$temp_quantity_count','$pro_product_price','$total_pamt','$temp_3','$temp_4','$temp_5','$cal_final_amt','$billdate1','$scri','$cdate','$scri','$uniqueId1','$disremark','Serial No','$actual_bill_type','$tcs_applicable','$tcs_perc','$tcs_Amt')");

		$res_stock = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date ='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
		$row_stock =  mysqli_fetch_assoc($res_stock);
		if(mysqli_num_rows($res_stock)>0)
		{
			$stock_quantity=$row_stock['closing_stock'];
			$temp_quantity=$stock_quantity+$temp_quantity_count;
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
				$temp_quantity=$stock_quantity+$temp_quantity_count;
				$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$ver','$proid','$stock_quantity','$temp_quantity','$cdate','$scri')");
				$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
			}
		}
		
		$res_profit = mysqli_query($con, "SELECT * FROM  tbl_product_profit_daywise where distributor_id='$ver' and product_id='$proid' ORDER BY `id` DESC LIMIT 1");
		if (mysqli_num_rows($res_profit) > 0) 
		{
			$row_step =  mysqli_fetch_assoc($res_profit);
			$final_balance_qty=$row_step['balance_qty']+$temp_quantity_count;
			$final_avg_price=$row_step['avg_price'];
			$stock_insert=mysqli_query($con,"INSERT INTO `tbl_product_profit_daywise`(`distributor_id`, `product_id`, `qty`, `purchase_price`,`sale_price`,`avg_price`,`balance_qty`,`profit_loss_per_qty`,`total_profit`,`date`,`time`,`type`) VALUES ('$ver','$proid','$temp_quantity_count','$pro_product_price','','$final_avg_price','$final_balance_qty','','','$cdate','$scri','Credit Note')");
		}
	}
	
	include("sale-purchase-balance-effect-class.php");
	$CashCollection=new Collectionbalance();
	$collections=$CashCollection->saleminuscollection($ver,$adjust_return_amount,$billdate1,$pp_id1);
	
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