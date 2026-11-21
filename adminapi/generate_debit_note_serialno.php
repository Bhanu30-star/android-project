<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['total_order']) && isset($_POST['bill_no']) && isset($_POST['bill_date']))
{
	$billdate=$_POST['bill_date'];
	$billno=$_POST['bill_no'];
	$uniqueId=uniqid();
	$uniqueId="DN".strtoupper($uniqueId);
	$adjust_return_amount=0;
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:sa");				
	$cdate  = date("Y-m-d");				     
	$scri =$cdate.' '.$scro;
	$temp_pro_party = $_POST['party_id'];
	$billno_autog_val=strtoupper($_POST['bill_no_autog']);
	$toder = $_POST['total_order'];
	$disremark=isset($_POST['remark']) ? $_POST['remark'] : '';
	if($billno==$billno_autog_val)
	{
		$select_order = mysqli_query($con, "select debit_note_sequence from `tbl_sequence` where distributor_id='$ver'");
		$select_row =  mysqli_fetch_assoc($select_order);
		if (mysqli_num_rows($select_order) > 0) {
			$uq_sequence = mysqli_query($con, "UPDATE tbl_sequence SET debit_note_sequence='$billno_autog_val',last_update_datetime='$scri' where distributor_id='$ver'");
		}
		else
		{
			$uq_sequence = mysqli_query($con, "INSERT IGNORE INTO tbl_sequence(distributor_id,debit_note_sequence,last_update_datetime)values('$ver','$billno_autog_val','$scri')");
		}
	}
	$json_a=json_decode($toder, true);     
	foreach ($json_a as $person_a)
	{
		$temp_pro_id=$person_a['product_id'];
		$temp_quantity_count=$person_a['quantity'];
		$t_selectimei=$person_a['imei_no'];
		$temp_return_cgst=isset($person_a['cgst_amt']) ? $person_a['cgst_amt'] : '0';
		$temp_return_sgst=isset($person_a['sgst_amt']) ? $person_a['sgst_amt'] : '0';
		$temp_return_igst=isset($person_a['igst_amt']) ? $person_a['igst_amt'] : '0';
		$total_amt=$person_a['total_amount'];
		$cal_final_amt=$person_a['net_amount'];
		$adjust_return_amount=$adjust_return_amount+$cal_final_amt;
		$pro_purchase_price=$person_a['purchase_price'];
		
		$tcs_perc = isset($_POST['tcs_perc']) ? $_POST['tcs_perc'] : '0';
		$tcs_applicable = isset($_POST['tcs_applicable']) ? $_POST['tcs_applicable'] : 'No';
		$tcs_Amt = isset($_POST['tcs_Amt']) ? $_POST['tcs_Amt'] : '0';
		
		$uploaddata1=trim($t_selectimei);
		$temp_imeino=explode(',',$uploaddata1);
		for($jk=0;$jk<sizeof($temp_imeino);$jk++)
		{
			if($temp_imeino[$jk]!='')
			{
				$res_serialno_detail=mysqli_query($con,"SELECT status,unique_bill FROM tbl_product_serialno where IMEI like '%$temp_imeino[$jk]' and product_id='$temp_pro_id' and status='Available' and user_id='0'");
				while($fetch_detail_serialno=mysqli_fetch_assoc($res_serialno_detail))
				{
					$insertQry=mysqli_query($con,"INSERT INTO `tbl_party_debit_note_deatil`(`product_id`, `IMEI`, `unique_bill`, `insert_date`, `insert_time`,`imei_unique_bill`) VALUES ('$temp_pro_id','$temp_imeino[$jk]','$uniqueId','$cdate','$scro','".$fetch_detail_serialno['unique_bill']."')");
				}	
				if($insertQry)
					$resd1 = mysqli_query($con,"DELETE FROM tbl_product_serialno where  IMEI like '%$temp_imeino[$jk]' and product_id='$temp_pro_id' and status='Available' and user_id='0'");
			}
		}
		$query = mysqli_query($con,"INSERT INTO `tbl_party_debit_note`(`distributor_id`, `purchase_party_id`, `bill_no`, `product_id`, `quantity`, `product_price`, `total_amount`, `cgst_amt`, `sgst_amt`, `igst_amt`, `final_net_amt`, `cess_amt`, `bill_date`, `bill_time`, `transaction_date`, `transaction_time`, `unique_bill`,`bill_type`,`remark`,`is_tcs`,`tcs_percentage`,`tcs_amount`) VALUES ('$ver','$temp_pro_party','$billno','$temp_pro_id','$temp_quantity_count','$pro_purchase_price','$total_amt','$temp_return_cgst','$temp_return_sgst','$temp_return_igst','$cal_final_amt','0','$billdate','$scro','$cdate','$scro','$uniqueId','Serial No','$disremark','$tcs_applicable','$tcs_perc','$tcs_Amt')");
		if($query)
		{
			$res_stock = mysqli_query($con,"SELECT closing_stock FROM tbl_distributor_stock where date ='$cdate' and distributor_id='$ver' and product_id='$temp_pro_id' ORDER BY `date` DESC LIMIT 1");
			$row_stock =  mysqli_fetch_assoc($res_stock);
			if(mysqli_num_rows($res_stock)>0)
			{
				$stock_quantity=$row_stock['closing_stock'];
				$temp_quantity=$stock_quantity-$temp_quantity_count;
				$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scri' where date ='$cdate' and distributor_id='$ver' and product_id='$temp_pro_id'");
				$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$scri' where product_id='$temp_pro_id' and distributor_id='$ver'");
			}
			else
			{
				$res_stock1 = mysqli_query($con,"SELECT closing_stock FROM tbl_distributor_stock where date<='$cdate' and distributor_id='$ver' and product_id='$temp_pro_id' ORDER BY `date` DESC LIMIT 1");
				$row_stock1 =  mysqli_fetch_assoc($res_stock1);
				if(mysqli_num_rows($res_stock1)>0)
				{
					$stock_quantity=$row_stock1['closing_stock'];
					$temp_quantity=$stock_quantity-$temp_quantity_count;
					$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock,date,time)values('$ver','$temp_pro_id','$stock_quantity','$temp_quantity','$cdate','$scri')");
					$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$scri' where product_id='$temp_pro_id' and distributor_id='$ver'");
				}
			}

			$res_profit = mysqli_query($con, "SELECT * FROM  tbl_product_profit_daywise where distributor_id='$ver' and product_id='$temp_pro_id' ORDER BY `id` DESC LIMIT 1");
			if (mysqli_num_rows($res_profit) > 0) 
			{
				$row_step =  mysqli_fetch_assoc($res_profit);
				$final_balance_qty=$row_step['balance_qty']-$temp_quantity_count;
				$final_avg_price=$row_step['avg_price'];
				$stock_insert = mysqli_query($con, "INSERT INTO `tbl_product_profit_daywise`(`distributor_id`, `product_id`, `qty`, `purchase_price`,`sale_price`,`avg_price`,`balance_qty`,`date`,`time`,`type`) VALUES ('$ver','$temp_pro_id','$temp_quantity_count','','$pro_purchase_price','$final_avg_price','$final_balance_qty','$cdate','$scri','Debit Note')");
			}
			
		}
    }
	include("sale-purchase-balance-effect-class.php");
	$CashCollection=new Collectionbalance();
	$collections=$CashCollection->purchaseminuscollection($ver,$cal_final_amt,$billdate,$temp_pro_party);
	$response['success']='1';
	$response['details']="Generate Debit Note Successfully";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>